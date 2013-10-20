#include "n_layout_widget.h"
#include "native_bridge.h"
#include "ui_n_layout_widget.h"
#include "n_layout_prop_edit.h"
#include "window/n_text_dialog.h"
#include "util/n_util.h"
#include "n_project.h"

#include <QWebView>
#include <QWebFrame>
#include <QMessageBox>
#include <QMenu>
#include <QWebInspector>
#include <QDebug>
#include <QList>

const QString NLayoutWidget::HtmlFilePath = "index_creator.html";

NLayoutWidget::NLayoutWidget(const QString &filePath, QWidget *parent) : NFileWidget(filePath, parent), ui(new Ui::NLayoutWidget)
{
    ui->setupUi(this);

    refreshForActive();

    QWebView *webView = ui->webView;
    QWebSettings *settings = webView->settings();
    QWebSettings::setObjectCacheCapacities(0, 0, 0);
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
    settings->setAttribute(QWebSettings::AcceleratedCompositingEnabled, false);

    mNative = new NativeBridge(this);
    QString layoutPath = NProject::instance()->relativeLayoutFilePath(filePath);
    mNative->setLayoutPath(layoutPath);
    injectNativeBridge();
    ui->layoutPropEdit->setNativeBridge(mNative);

    reload();

    connect(ui->viewClassTreeWidget, SIGNAL(itemDoubleClicked(QTreeWidgetItem*,int)), this, SLOT(addViewToJS(QTreeWidgetItem*, int)));
    connect(ui->layerTreeWidget, SIGNAL(changedTreeByDrop(QTreeWidgetItem *)), this, SLOT(updateViewsToJS(QTreeWidgetItem*)));
    connect(ui->layerTreeWidget, SIGNAL(itemSelectionChanged()), this, SLOT(selectViewToJS()));
    connect(ui->layerTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForViewsTree(QPoint)));
    connect(ui->screenEnable, SIGNAL(toggled(bool)), this, SLOT(setScreenEnable(bool)));
    connect(ui->screenScene, SIGNAL(currentTextChanged(QString)), this, SLOT(setScreenToJS()));
    connect(ui->screenPage, SIGNAL(currentTextChanged(QString)), this, SLOT(setScreenToJS()));
    connect(ui->webView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForWebView(QPoint)));
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    connect(mNative, SIGNAL(changedLayoutContentFromJS()), this, SLOT(changed()));
    connect(mNative, SIGNAL(viewsFromJS(NJson)), this, SLOT(setViewsFromJS(NJson)));
    connect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setCurrentViewFromJS(NJson)));
}

bool NLayoutWidget::innerSave() {
    QString contentLayoutJsonText = this->contentLayoutJsonText();

    QFile file(mFilePath);

    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail open file.") + "\n" + mFilePath);
        return false;
    }
    int ret = file.write(contentLayoutJsonText.toUtf8());
    if (ret == -1) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail save file.") + "\n" + mFilePath);
        return false;
    }

    return true;
}

void NLayoutWidget::refreshForActive() {
    ui->screenScene->setList(NProject::instance()->scenes());
    ui->screenPage->setList(NProject::instance()->pages());
    ui->layoutPropEdit->refreshForActive();
}

QString NLayoutWidget::contentLayoutJsonText() const {
    QWebFrame *frame = ui->webView->page()->mainFrame();
    QVariant variant = frame->evaluateJavaScript("window.getContentLayout();");
    return variant.toString();
}

void NLayoutWidget::injectNativeBridge (){
    QWebView *webView = ui->webView;
    webView->page()->mainFrame()->addToJavaScriptWindowObject(QString("Native"), mNative);
}

/***************************************************
 * context menu
 **************************************************/
void NLayoutWidget::contextMenuForViewsTree(const QPoint &point) {
    QMenu menu(this);

    menu.addAction(tr("&Delete"), this, SLOT(deleteViewToJS()));

    // 選択されたところに行があるときしかメニューを表示しない
    QModelIndex index = ui->layerTreeWidget->indexAt(point);
    if (index.isValid()) {
        menu.exec(QCursor::pos());
    } else {
        ui->layerTreeWidget->clearSelection();
    }
}

void NLayoutWidget::contextMenuForWebView(const QPoint &/*point*/) {
    QMenu menu(this);

    QMenu *alignmentSubMenu = menu.addMenu(tr("&Alignment"));
    alignmentSubMenu->addAction(tr("&Top Alignment"), this, SLOT(alignTopToJS()));
    alignmentSubMenu->addAction(tr("&Center Alignment"), this, SLOT(alignVCenterToJS()));
    alignmentSubMenu->addAction(tr("&Bottom Alignment"), this, SLOT(alignBottomToJS()));
    alignmentSubMenu->addSeparator();
    alignmentSubMenu->addAction(tr("&Left Alignment"), this, SLOT(alignLeftToJS()));
    alignmentSubMenu->addAction(tr("&Center Alignment"), this, SLOT(alignHCenterToJS()));
    alignmentSubMenu->addAction(tr("&Right Alignment"), this, SLOT(alignRightToJS()));

    QMenu *arrangementSubMenu = menu.addMenu(tr("&Arrangement"));
    arrangementSubMenu->addAction(tr("&Horizontal Closely"), this, SLOT(arrangeHorizontalClosely()));
    arrangementSubMenu->addAction(tr("&Vertical Closely"), this, SLOT(arrangeVerticalClosely()));
    arrangementSubMenu->addSeparator();
    arrangementSubMenu->addAction(tr("&Horizontal Even"), this, SLOT(arrangeHorizontalEven()));
    arrangementSubMenu->addAction(tr("&Vertical Even"), this, SLOT(arrangeVerticalEven()));

    menu.addSeparator();

    menu.addAction(tr("&Reload"), this ,SLOT(reload()));
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.addAction(tr("&Inspector"), this, SLOT(showInspector()));

    menu.exec(QCursor::pos());
}

/************************************************
 * for webview
 ************************************************/
void NLayoutWidget::reload() {
    QWebView *webView = ui->webView;
    QString htmlPath = "file://" + NProject::instance()->contentsFilePath(HtmlFilePath);
    webView->load(QUrl(htmlPath));
}

void NLayoutWidget::showRawData() {
    QString jsonText = contentLayoutJsonText();
    NTextDialog dialog(this);
    dialog.setText(jsonText);
    dialog.exec();
}

void NLayoutWidget::showInspector() {
    QWebPage *page = ui->webView->page();
    QWebInspector *inspector = new QWebInspector;
    inspector->setPage(page);
    inspector->show();
}

/*******************************************
 * from js method
 *******************************************/
void NLayoutWidget::setViewsFromJS(const NJson &views) {
    QTreeWidget *layerTreeWidget = ui->layerTreeWidget;
    layerTreeWidget->clear();
    for (int i = 0; i < views.length(); i++) {
        QStringList row;
        NUtil::expand(row, 2);
        QString index = QString::number(i);
        row[ViewsColId] = views.getStr(index + ".id");
        row[ViewsColClass] = views.getStr(index + ".class");

        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);

        layerTreeWidget->addTopLevelItem(item);
    }
}

void NLayoutWidget::setCurrentViewFromJS(const NJson &views) {
    QTreeWidget *tree = ui->layerTreeWidget;
    tree->blockSignals(true);

    tree->clearSelection();
    for (int i = 0; i < views.length(); i++) {
        QString index = QString::number(i);
        QString viewId = views.getStr(index + ".id");
        QTreeWidgetItem *item = tree->findItems(viewId, Qt::MatchFixedString, 0)[0];
        tree->setCurrentItem(item);
    }

    tree->blockSignals(false);

    // 複数選択しているときはプロパティの設定をできないようにする
    if (views.length() >= 2) {
        ui->layoutPropEdit->setEnabled(false);
    } else {
        ui->layoutPropEdit->setEnabled(true);
    }
}

/*************************************************
 * to js method
 *************************************************/
void NLayoutWidget::updateViewsToJS(QTreeWidgetItem *droppedItem) {
    NTreeWidget *tree = ui->layerTreeWidget;
    int layerNum = tree->topLevelItemCount();
    QStringList viewIds;
    for (int i = 0; i < layerNum; i++) {
        viewIds.append(tree->topLevelItem(i)->text(ViewsColId));
    }
    emit mNative->changedViewsOrderToJS(viewIds);

    // ドロップすることで選択されているviewが変更されるのでドロップされてviewを選択状態に戻す
    tree->setCurrentItem(droppedItem);
}

void NLayoutWidget::selectViewToJS() {
    QList <QTreeWidgetItem *> items = ui->layerTreeWidget->selectedItems();
    QStringList viewIds;
    for (int i = 0; i< items.length(); i++) {
        viewIds.append(items[i]->text(ViewsColId));
    }

    // 複数選択しているときはプロパティの設定をできないようにする
    if (items.length() >= 2) {
        ui->layoutPropEdit->setEnabled(false);
    } else {
        ui->layoutPropEdit->setEnabled(true);
    }

    disconnect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setCurrentViewFromJS(NJson)));
    emit mNative->unselectAllViewsToJS();
    emit mNative->changedSelectedViewToJS(viewIds);
    connect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setCurrentViewFromJS(NJson)));
}

void NLayoutWidget::addViewToJS(QTreeWidgetItem *item, int /* index */) {
    QTreeWidget *tree = ui->layerTreeWidget;

    // viewIdがかぶってしまうのを防ぐためにループを回す
    QString viewId;
    {
        int suffix = 1;
        while (true) {
            viewId = item->text(ViewClassColName) + QString::number(tree->topLevelItemCount() + suffix);
            if (tree->findItems(viewId, Qt::MatchFixedString | Qt::MatchCaseSensitive).length() == 0) {
                break;
            }
            suffix++;
        }
    }
    QString viewClass = item->text(ViewClassColClass);

    QStringList row;
    NUtil::expand(row, 2);
    row[ViewsColId] = viewId;
    row[ViewsColClass] = viewClass;
    QTreeWidgetItem *viewsItem = new QTreeWidgetItem(row);
    viewsItem->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);
    tree->addTopLevelItem(viewsItem);

    emit mNative->addViewToJS(viewId, viewClass);
}

void NLayoutWidget::deleteViewToJS() {
    // delete item from tree;
    QTreeWidgetItem *item = ui->layerTreeWidget->currentItem();
    int index = ui->layerTreeWidget->indexOfTopLevelItem(item);
    ui->layerTreeWidget->takeTopLevelItem(index);

    QString viewId = item->text(ViewsColId);
    emit mNative->deleteViewToJS(viewId);
}

void NLayoutWidget::setScreenToJS() {
    QString sceneId = ui->screenScene->currentText();
    QString pageId = ui->screenPage->currentText();

    emit mNative->setScreenToJS(sceneId, pageId);
}

void NLayoutWidget::setScreenEnable(bool enable) {
    ui->screenPage->setEnabled(enable);
    ui->screenScene->setEnabled(enable);

    if (enable) {
        emit mNative->setScreenEnableToJS(true);
        setScreenToJS();
    } else {
        emit mNative->setScreenEnableToJS(false);
    }
}

NLayoutWidget::~NLayoutWidget()
{
    delete ui;
}
