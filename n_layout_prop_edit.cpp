#include "n_layout_prop_edit.h"
#include "ui_n_layout_prop_edit.h"
#include "util/n_json.h"
#include "util/n_util.h"
#include "n_project.h"
#include <extend/n_completer.h>

#include <QCompleter>
#include <QDebug>
#include <QListView>
#include <QSortFilterProxyModel>

const QString NLayoutPropEdit::ClassView = "Navy.View.View";
const QString NLayoutPropEdit::ClassText = "Navy.View.Text";
const QString NLayoutPropEdit::ClassImage = "Navy.View.Image";
const QString NLayoutPropEdit::ClassViewGroup = "Navy.ViewGroup.ViewGroup";

NLayoutPropEdit::NLayoutPropEdit(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutPropEdit)
{
    ui->setupUi(this);

    refreshForActive();

    hideAllExtraPropWidget();

    connectWidgetToJson();
}

void NLayoutPropEdit::refreshForActive() {

    {
        QComboBox *src = ui->extraSrc;
        QStringList imageList = NProject::instance()->images();
        src->clear();
        src->addItems(imageList);
        QCompleter *completer = new QCompleter(imageList, src);
        completer->setModelSorting(QCompleter::CaseInsensitivelySortedModel);
        completer->setCaseSensitivity(Qt::CaseInsensitive);
        src->setCompleter(completer);
    }

    {
        QComboBox *layout =  ui->extraContentLayout;
        QStringList layoutList = NProject::instance()->layouts();
        layout->clear();
        layout->addItems(layoutList);
        NCompleter *completer = new NCompleter(layoutList, layout);
        completer->setComboBox(layout);
    }

}

void NLayoutPropEdit::setNativeBridge(NativeBridge *native) {
    mNative = native;

    connect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setViewFromJS(NJson)));
    connect(mNative, SIGNAL(currentViewPosFromJS(int,int)), this, SLOT(setViewPosFromJS(int,int)));
}

void NLayoutPropEdit::connectWidgetToJson() {
    connect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->backgroundColor, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizePolicy, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->linkType, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->linkId, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));

    // text
    connect(ui->extraText, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->extraFontSize, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));

    // image
    connect(ui->extraSrc, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));

    // view group
    connect(ui->extraContentLayout, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::disconnectWidgetToJson() {
    disconnect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->backgroundColor, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->sizePolicy, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->linkType, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->linkId, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));

    // text
    disconnect(ui->extraText, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->extraFontSize, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));

    // image
    disconnect(ui->extraSrc, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));

    // view group
    disconnect(ui->extraContentLayout, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::syncWidgetToJson() {
    mView.set("pos.x", ui->posXSpinBox->value());
    mView.set("pos.y", ui->posYSpinBox->value());
    mView.set("size.width", ui->sizeWidthSpinBox->value());
    mView.set("size.height", ui->sizeHeightSpinBox->value());
    mView.set("backgroundColor", ui->backgroundColor->text());
    mView.set("sizePolicy", ui->sizePolicy->currentText());

    if (ui->linkType->currentIndex() != 0) {
        mView.set("link.type", ui->linkType->currentText());
        mView.set("link.id", ui->linkId->text());
    } else {
        mView.remove("link");
    }

    QString className = mView.getStr("class");
    if (className == ClassView) {
       // nothing
    } else if (className == ClassText){
        mView.set("extra.text", ui->extraText->text());
        mView.set("extra.fontSize", ui->extraFontSize->value());
    } else if (className == ClassImage) {
        mView.set("extra.src", ui->extraSrc->currentText());
    } else if (className == ClassViewGroup) {
        mView.set("extra.contentLayoutFile", ui->extraContentLayout->currentText());
    }

    emit mNative->changedViewPropertyToJS(mView.toVariant());
}

void NLayoutPropEdit::hideAllExtraPropWidget() {
    ui->imageViewWidget->hide();
    ui->textViewWidget->hide();
    ui->viewGroupWidget->hide();
}

void NLayoutPropEdit::showExtraPropWidget(QString className) {
    if (className == ClassView) {
        return;
    } else if (className == ClassImage) {
        ui->imageViewWidget->show();
    } else if (className == ClassText) {
        ui->textViewWidget->show();
    } else if (className == ClassViewGroup) {
        ui->viewGroupWidget->show();
    }
}

void NLayoutPropEdit::setViewFromJS(const NJson &view) {
    disconnectWidgetToJson();

    mView = view;
    ui->idLabel->setText(view.getStr("id"));
    ui->classLabel->setText(view.getStr("class"));
    ui->posXSpinBox->setValue(view.getInt("pos.x"));
    ui->posYSpinBox->setValue(view.getInt("pos.y"));
    ui->sizeWidthSpinBox->setValue(view.getInt("size.width"));
    ui->sizeHeightSpinBox->setValue(view.getInt("size.height"));
    ui->backgroundColor->setText(view.getStr("backgroundColor"));
    ui->sizePolicy->setCurrentText(view.getStr("sizePolicy"));

    ui->linkType->setCurrentIndex(0);
    ui->linkType->setCurrentText(view.getStr("link.type"));
    ui->linkId->setText(view.getStr("link.id"));


    QString className = view.getStr("class");
    if (className == ClassView) {
       // nothing
    } else if (className == ClassText){
        ui->extraText->setText(view.getStr("extra.text"));
        ui->extraFontSize->setValue(view.getInt("extra.fontSize"));
    } else if (className == ClassImage) {
        ui->extraSrc->setCurrentText(view.getStr("extra.src"));
    } else if (className == ClassViewGroup) {
        ui->extraContentLayout->setCurrentText(view.getStr("extra.contentLayoutFile"));
    }




    hideAllExtraPropWidget();
    showExtraPropWidget(view.getStr("class"));

    connectWidgetToJson();
}

void NLayoutPropEdit::setViewPosFromJS(const int &x, const int &y) {
    disconnectWidgetToJson();

    ui->posXSpinBox->setValue(x);
    ui->posYSpinBox->setValue(y);

    connectWidgetToJson();
}


NLayoutPropEdit::~NLayoutPropEdit()
{
    delete ui;
}
