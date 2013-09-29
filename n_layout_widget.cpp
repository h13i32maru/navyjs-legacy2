#include "n_layout_widget.h"
#include "native_bridge.h"
#include "ui_n_layout_widget.h"
#include "n_layout_edit_widget.h"
#include "n_layout_prop_edit.h"
#include "edit_json_dialog.h"
#include "n_util.h"

#include <QWebView>
#include <QWebFrame>
#include <QMessageBox>
#include <QMenu>
#include <QWebInspector>

NLayoutWidget::NLayoutWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NLayoutWidget)
{
    ui->setupUi(this);

    QWebView *webView = ui->webView;
    QWebSettings *settings = webView->settings();
    QWebSettings::setObjectCacheCapacities(0, 0, 0);
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
    settings->setAttribute(QWebSettings::AcceleratedCompositingEnabled, false);

    mNative = new NativeBridge(this);
    QString layoutPath = QString(filePath).remove(0, mProjectDir.absolutePath().length() + 1);
    mNative->setLayoutPath(layoutPath);
    injectNativeBridge();
    ui->layoutPropEdit->setNativeBridge(mNative);

    loadFile(mProjectDir.absoluteFilePath("index_creator.html"));

    connect(mNative, SIGNAL(changedLayoutContent()), this, SLOT(changed()));
    connect(ui->viewClassTreeWidget, SIGNAL(itemDoubleClicked(QTreeWidgetItem*,int)), this, SLOT(addViewToJS(QTreeWidgetItem*, int)));
    connect(ui->layerTreeWidget, SIGNAL(changedTreeByDrop()), this, SLOT(updateViewsToJS()));
    connect(ui->layerTreeWidget, SIGNAL(itemSelectionChanged()), this, SLOT(selectViewToJS()));
    connect(ui->layerTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForViewsTree(QPoint)));
    connect(ui->webView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForWebView(QPoint)));
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    connect(mNative, SIGNAL(viewsFromJS(QList<QMap<QString,QString> >)), this, SLOT(setViewsFromJS(QList<QMap<QString,QString> >)));
    connect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setCurrentViewFromJS(NJson)));
}

bool NLayoutWidget::save() {
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

void NLayoutWidget::loadFile(QString filePath) {
    mFilePath = filePath;
    QWebView *webView = ui->webView;
    QString htmlPath = "file://" + mFilePath;
    webView->load(QUrl(htmlPath));
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
    QString htmlPath = "file://" + mFilePath;
    webView->load(QUrl(htmlPath));
}

void NLayoutWidget::showRawData() {
    QString jsonText = contentLayoutJsonText();
    EditJsonDialog dialog(this);
    dialog.setJsonText(jsonText);
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
void NLayoutWidget::setViewsFromJS(const QList<QMap<QString, QString> > &views) {
    QTreeWidget *layerTreeWidget = ui->layerTreeWidget;
    layerTreeWidget->clear();
    for (int i = 0; i < views.length(); i++) {
        QStringList row;
        NUtil::expand(row, 2);
        row[ViewsColId] = views[i]["id"];
        row[ViewsColClass] = views[i]["class"];

        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);

        layerTreeWidget->addTopLevelItem(item);
    }
}

void NLayoutWidget::setCurrentViewFromJS(const NJson &json) {
    QString viewId = json.getStr("id");

    QTreeWidget *tree = ui->layerTreeWidget;
    for (int i = 0; i < tree->topLevelItemCount(); i++) {
        QTreeWidgetItem *item = tree->topLevelItem(i);
        QString _viewId = item->text(ViewsColId);
        if (_viewId == viewId) {
            tree->setCurrentItem(item);
            return;
        }
    }
}

/*************************************************
 * to js method
 *************************************************/
void NLayoutWidget::updateViewsToJS() {
    NTreeWidget *tree = ui->layerTreeWidget;
    int layerNum = tree->topLevelItemCount();
    QStringList viewIds;
    for (int i = 0; i < layerNum; i++) {
        viewIds.append(tree->topLevelItem(i)->text(ViewsColId));
    }
    emit mNative->changedViewsOrderToJS(viewIds);
}

void NLayoutWidget::selectViewToJS() {
    NTreeWidget *tree = ui->layerTreeWidget;

    QTreeWidgetItem *item = tree->currentItem();

    // viewの削除によって、countは1なのにitemはnullの場合がある
    if (item == NULL) {
       return;
    }

    QString viewId = item->text(ViewsColId);
    emit mNative->changedSelectedViewToJS(viewId);
}

void NLayoutWidget::addViewToJS(QTreeWidgetItem *item, int /* index */) {
    QTreeWidget *tree = ui->layerTreeWidget;
    QString viewId = item->text(ViewClassColName) + QString::number(tree->topLevelItemCount() + 1);
    QString viewClass = item->text(ViewClassColClass);

    QStringList row;
    NUtil::expand(row, 2);
    row[ViewsColId] = viewId;
    row[ViewsColClass] = viewClass;
    QTreeWidgetItem *viewsItem = new QTreeWidgetItem(row);
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

NLayoutWidget::~NLayoutWidget()
{
    delete ui;
}
