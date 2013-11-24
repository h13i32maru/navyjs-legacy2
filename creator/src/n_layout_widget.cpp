#include "n_layout_widget.h"
#include "native_bridge.h"
#include "ui_n_layout_widget.h"
#include "n_layout_prop_edit.h"
#include "window/n_text_dialog.h"
#include "util/n_util.h"
#include "n_project.h"
#include "plugin/view_plugin.h"

#include <QWebView>
#include <QWebFrame>
#include <QMessageBox>
#include <QMenu>
#include <QWebInspector>
#include <QDebug>
#include <QList>
#include <QLineEdit>
#include <QSpinBox>
#include <QTableView>

#include <QStandardItemModel>

#include <window/n_layout_setting_dialog.h>
#include <ui_n_layout_setting_dialog.h>

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

    connect(ui->layerToggleButton, SIGNAL(clicked()), this, SLOT(toggleLayerTreeWidget()));
    connect(ui->propToggleButton, SIGNAL(clicked()), this, SLOT(toggleLayoutPropWidget()));
    connect(ui->viewToggleButton, SIGNAL(clicked()), this, SLOT(toggleViewClassTreeWidget()));

    reload();

    connect(ui->viewClassTreeWidget, SIGNAL(itemDoubleClicked(QTreeWidgetItem*,int)), this, SLOT(addViewToJS(QTreeWidgetItem*, int)));
    connect(ui->layerTreeWidget, SIGNAL(changedTreeByDrop(QTreeWidgetItem *)), this, SLOT(updateViewsToJS(QTreeWidgetItem*)));
    connect(ui->layerTreeWidget, SIGNAL(itemSelectionChanged()), this, SLOT(selectViewToJS()));
    connect(ui->layerTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForViewsTree(QPoint)));
    connect(ui->webView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForWebView(QPoint)));
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    connect(mNative, SIGNAL(changedLayoutContentFromJS()), this, SLOT(changed()));
    connect(mNative, SIGNAL(viewsFromJS(NJson)), this, SLOT(setViewsFromJS(NJson)));
    connect(mNative, SIGNAL(selectedViewsFromJS(NJson)), this, SLOT(setSelectedsViewsFromJS(NJson)));


    /*
    QStandardItemModel *model = new QStandardItemModel(10, 2);
    model->setHorizontalHeaderItem(0, new QStandardItem("hoge"));
    model->setHorizontalHeaderItem(1, new QStandardItem("foo"));
    ui->tableView->setModel(model);
    QModelIndex index = model->index(0,0);
    ui->tableView->setIndexWidget(index, new QLabel("test"));
    index = model->index(0,1);
    ui->tableView->setIndexWidget(index, new QCheckBox());
    ui->tableView->setRowHeight(0, QLabel("AAA").sizeHint().height() * 1.5);

    model->setItem(1,0, new QStandardItem("test2"));
    index = model->index(1,1);
//    ui->tableView->setIndexWidget(index, new QCheckBox());
    ui->tableView->setIndexWidget(index, new QSpinBox());
    */

    // create property widget for view.
    int height = QLabel("AAA").sizeHint().height() * 1.5;
    QList<NJson> jsonList = ViewPlugin::instance()->getJsonList();
    for (int i = 0; i < jsonList.length(); i++) {
        NJson json = jsonList[i];
        NJson widgetDefine = json.getObject("define");

        QModelIndex modelIndex;
        QStandardItemModel *model = new QStandardItemModel(widgetDefine.length(), 2);
        model->setHorizontalHeaderItem(0, new QStandardItem("Property"));
        model->setHorizontalHeaderItem(1, new QStandardItem("Value"));

        QTableView *tableView = new QTableView();
        ui->propScrollAreaWidgetContents->layout()->addWidget(tableView);
        tableView->setModel(model);
        tableView->horizontalHeader()->setStretchLastSection(true);
        tableView->verticalHeader()->setHidden(true);

        model->setItem(0, 0, new QStandardItem("class"));
        modelIndex = model->index(0, 1);
        tableView->setIndexWidget(modelIndex, new QLineEdit(json.getStr("class")));
        tableView->setRowHeight(0, height);

        for (int j = 0, row = 1; j < widgetDefine.length(); j++, row++) {
            QString index = QString::number(j);
            QString label = widgetDefine.getStr(index + ".label");
            model->setItem(row, 0, new QStandardItem(label));
            modelIndex = model->index(row, 1);
            tableView->setIndexWidget(modelIndex, new QLineEdit(label));
            tableView->setRowHeight(row, height);
        }

        qDebug() << widgetDefine.length() * height << tableView->sizeHint().height();
        tableView->setMinimumHeight((widgetDefine.length() + 2) * height);
        tableView->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
        tableView->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    }
}

void NLayoutWidget::toggleLayerTreeWidget() {
    ui->layerTreeWidget->setVisible(ui->layerTreeWidget->isVisible() ^ true);
}

void NLayoutWidget::toggleLayoutPropWidget() {
    ui->layoutPropEdit->setVisible(ui->layoutPropEdit->isVisible() ^ true);
}

void NLayoutWidget::toggleViewClassTreeWidget() {
    ui->viewClassTreeWidget->setVisible(ui->viewClassTreeWidget->isVisible() ^ true);
}

void NLayoutWidget::showLayoutSettingDialog() {
    NLayoutSettingDialog dialog;
    int ret = dialog.exec();
    if (ret != NLayoutSettingDialog::Accepted) {
        return;
    }

    bool enable = dialog.ui->screenEnable->isEnabled();

    if (enable) {
        QString sceneId = dialog.ui->screenScene->currentText();
        QString pageId = dialog.ui->screenPage->currentText();
        emit mNative->setScreenEnableToJS(true);
        emit mNative->setScreenToJS(sceneId, pageId);
    } else {
        emit mNative->setScreenEnableToJS(false);
    }
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

    menu.addAction(tr("&Delete Selected Views"), this, SLOT(deleteSelectedViewsToJS()));

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

    menu.addAction(tr("&Delete Selected Views"), this, SLOT(deleteSelectedViewsToJS()));

    menu.addSeparator();

    menu.addAction(tr("&Setting"), this, SLOT(showLayoutSettingDialog()));
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

void NLayoutWidget::setSelectedsViewsFromJS(const NJson &views) {
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

    disconnect(mNative, SIGNAL(selectedViewsFromJS(NJson)), this, SLOT(setSelectedsViewsFromJS(NJson)));
    emit mNative->unselectAllViewsToJS();
    emit mNative->changedSelectedViewToJS(viewIds);
    connect(mNative, SIGNAL(selectedViewsFromJS(NJson)), this, SLOT(setSelectedsViewsFromJS(NJson)));
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

void NLayoutWidget::deleteSelectedViewsToJS() {
    QTreeWidget *tree = ui->layerTreeWidget;
    tree->blockSignals(true);
    QList <QTreeWidgetItem *> items = tree->selectedItems();
    for (int i = 0; i< items.length(); i++) {
        int index = tree->indexOfTopLevelItem(items[i]);
        tree->takeTopLevelItem(index);
    }
    tree->blockSignals(false);

    emit mNative->deleteSelectedViewsToJS();
}

NLayoutWidget::~NLayoutWidget()
{
    delete ui;
}
