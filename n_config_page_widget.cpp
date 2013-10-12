#include "window/n_text_dialog.h"
#include "n_config_page_widget.h"
#include "util/n_util.h"
#include "ui_n_config_page_widget.h"

#include <QCompleter>
#include <QMenu>
#include <QMessageBox>

#include <window/n_page_dialog.h>

NConfigPageWidget::NConfigPageWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NConfigPageWidget)
{
    ui->setupUi(this);

    mConfigPage.parseFromFilePath(filePath);
    syncJsonToTree();

    connect(ui->pageConfigTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(ui->pageConfigTreeWidget, SIGNAL(doubleClicked(QModelIndex)), this, SLOT(showPageDialog(QModelIndex)));
}

void NConfigPageWidget::showPageDialog(const QModelIndex &/*index*/) {
    QTreeWidgetItem *item = ui->pageConfigTreeWidget->currentItem();
    if (item == NULL) {
        return;
    }

    QString pageId = item->text(PAGE_COL_ID);
    NPageDialog dialog(NPageDialog::TYPE_UPDATE, mConfigPage, this);
    dialog.setPageId(pageId);
    int ret = dialog.exec();
    if (ret == NPageDialog::Accepted) {
        syncJsonToTree();
        changed();
    }
}

bool NConfigPageWidget::innerSave() {
    QFile configPageFile(mFilePath);
    if (!configPageFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
        return false;
    }
    int ret = configPageFile.write(this->mConfigPage.stringify());

    return (ret == -1 ? false: true);
}



void NConfigPageWidget::syncJsonToTree() {
    ui->pageConfigTreeWidget->clear();

    QList<QTreeWidgetItem *> items;
    for (int i = 0; i < mConfigPage.length(); i++) {
        QString index = QString::number(i);
        NJson page = mConfigPage.getObject(index);
        QStringList row;
        NUtil::expand(row, ui->pageConfigTreeWidget->columnCount());
        row[PAGE_COL_ID] = page.getStr("id");
        row[PAGE_COL_CLASS] = page.getStr("class");
        row[PAGE_COL_CLASS_FILE] = page.getStr("classFile");
        row[PAGE_COL_LAYOUT] = page.getStr("extra.contentLayoutFile");
        row[PAGE_COL_BGCOLOR] = page.getStr("backgroundColor");
        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        items.append(item);
    }

    ui->pageConfigTreeWidget->addTopLevelItems(items);
}

void NConfigPageWidget::showRawData() {
    NTextDialog dialog(this);
    dialog.setText(mConfigPage.stringify());
    dialog.exec();
}

void NConfigPageWidget::newPage() {
    NPageDialog dialog(NPageDialog::TYPE_CREATE, mConfigPage, this);
    int ret = dialog.exec();
    if (ret == NPageDialog::Accepted) {
        syncJsonToTree();
        changed();
    }
}

void NConfigPageWidget::removePage() {
    // FIXME: Sceneから参照されていないかチェックする必要あり

    QList<QTreeWidgetItem *> selectedItems = ui->pageConfigTreeWidget->selectedItems();
    if (selectedItems.length() == 0) {
        return;
    }

    QTreeWidgetItem *item = selectedItems[0];

    int ret = QMessageBox::question(NULL, tr(""), tr("do you remove page?"));

    if (ret == QMessageBox::Yes) {
        int index = mConfigPage.searchValue("id", item->text(PAGE_COL_ID));
        mConfigPage.remove(QString::number(index));
        syncJsonToTree();
        changed();
    }
}

void NConfigPageWidget::contextMenu(QPoint /*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&New Page"), this, SLOT(newPage()));
    menu.addAction(tr("&Remove Page"), this, SLOT(removePage()));
    menu.addSeparator();
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.exec(QCursor::pos());
}

NConfigPageWidget::~NConfigPageWidget()
{
    delete ui;
}
